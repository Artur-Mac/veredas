# /// script
# requires-python = ">=3.12"
# dependencies = ["duckdb>=1.4"]
# ///
import duckdb

from comum import BRUTOS, DERIVADOS, sql_lista, sql_texto

PASTA = BRUTOS / "recife" / "defesa-civil"
ANOS_COM_CABECALHO_CORRETO = (2021, 2023, 2024)
ANO_COM_COLUNAS_DESLOCADAS = 2022
SAIDA_REGISTROS = DERIVADOS / "defesa_civil_2021_2024.parquet"
SAIDA_VALORES = DERIVADOS / "defesa_civil_valores_distintos.csv"
CAMPOS_COM_ROTULO_CANONICO = ("ocorrencia", "solicitacao", "tipo_da_acao")
COLUNAS_2022 = "{" + ", ".join(f"'c{indice:02d}': 'VARCHAR'" for indice in range(1, 17)) + "}"


def consulta_padrao() -> str:
    arquivos = [PASTA / f"atendimentos-{ano}.csv" for ano in ANOS_COM_CABECALHO_CORRETO]
    return f"""
    SELECT
        regexp_extract(filename, 'atendimentos-(\\d{{4}})', 1)::INTEGER AS ano_arquivo,
        Regional AS regional,
        Data AS data_texto,
        Ocorrencia AS ocorrencia,
        Solicitacao AS solicitacao,
        regexp_replace(Endereco, ',[^,]*$', '') AS logradouro_texto,
        Bairro AS bairro,
        Localidade AS localidade,
        Grau_de_Risco AS grau_de_risco_original,
        Data_da_Acao AS data_da_acao_texto,
        Tipo_da_Acao AS tipo_da_acao,
        Quantidade AS quantidade,
        Altura AS altura,
        Largura AS largura,
        Area_m AS area_m2
    FROM read_csv({sql_lista(arquivos)}, delim=';', header=true, all_varchar=true, filename=true)
    """


def consulta_2022() -> str:
    arquivo = PASTA / f"atendimentos-{ANO_COM_COLUNAS_DESLOCADAS}.csv"
    return f"""
    SELECT
        {ANO_COM_COLUNAS_DESLOCADAS} AS ano_arquivo,
        NULL::VARCHAR AS regional,
        c03 AS data_texto,
        c04 AS ocorrencia,
        c05 AS solicitacao,
        trim(c06, '" ') AS logradouro_texto,
        c08 AS bairro,
        c09 AS localidade,
        c10 AS grau_de_risco_original,
        c11 AS data_da_acao_texto,
        c12 AS tipo_da_acao,
        c13 AS quantidade,
        c14 AS altura,
        c15 AS largura,
        c16 AS area_m2
    FROM read_csv({sql_texto(arquivo)}, delim=';', header=false, skip=1, all_varchar=true, columns={COLUNAS_2022})
    """


CONSULTA_TIPADA = """
CREATE TABLE registros AS
SELECT
    ano_arquivo,
    coalesce(try_strptime(data_texto, '%Y-%m-%d'), try_strptime(data_texto, '%d/%m/%Y'))::DATE AS data,
    nullif(trim(regional), '') AS regional,
    nullif(trim(ocorrencia), '') AS ocorrencia,
    nullif(trim(solicitacao), '') AS solicitacao,
    nullif(trim(tipo_da_acao), '') AS tipo_da_acao,
    nullif(trim(grau_de_risco_original), '') AS grau_de_risco_original,
    CASE WHEN upper(trim(grau_de_risco_original)) IN ('R1', 'R2', 'R3', 'R4')
         THEN upper(trim(grau_de_risco_original)) END AS grau_de_risco,
    nullif(trim(logradouro_texto), '') AS logradouro_texto,
    nullif(trim(bairro), '') AS bairro,
    nullif(trim(localidade), '') AS localidade,
    coalesce(try_strptime(data_da_acao_texto, '%Y-%m-%d'), try_strptime(data_da_acao_texto, '%d/%m/%Y'))::DATE AS data_da_acao,
    try_cast(replace(quantidade, ',', '.') AS DOUBLE) AS quantidade,
    try_cast(replace(altura, ',', '.') AS DOUBLE) AS altura,
    try_cast(replace(largura, ',', '.') AS DOUBLE) AS largura,
    try_cast(replace(area_m2, ',', '.') AS DOUBLE) AS area_m2
FROM brutos
"""


def chave_categoria(coluna: str) -> str:
    sem_nao_ascii = f"regexp_replace({coluna}, '[^\\x00-\\x7F]', '', 'g')"
    return f"nullif(trim(regexp_replace(lower({sem_nao_ascii}), '[^a-z0-9]+', ' ', 'g')), '')"


def acrescentar_rotulo_canonico(conexao: duckdb.DuckDBPyConnection, campo: str) -> None:
    conexao.execute(
        f"""
        CREATE TABLE canonico_{campo} AS
        SELECT chave, arg_max(valor, [regexp_matches(valor, '[^\\x00-\\x7F]')::INTEGER, n]) AS canonico
        FROM (
            SELECT {chave_categoria(campo)} AS chave, {campo} AS valor, count(*) AS n
            FROM registros WHERE {campo} IS NOT NULL GROUP BY ALL
        )
        GROUP BY chave
        """
    )
    conexao.execute(
        f"""
        CREATE OR REPLACE TABLE registros AS
        SELECT r.*, c.canonico AS {campo}_canonico
        FROM registros r LEFT JOIN canonico_{campo} c ON c.chave = {chave_categoria('r.' + campo)}
        """
    )


def consulta_valores_distintos() -> str:
    partes = [
        f"""
        SELECT '{campo}' AS campo, {campo}_canonico AS valor, count(*) AS registros,
               string_agg(DISTINCT {campo}, ' | ' ORDER BY {campo}) AS variantes_na_fonte
        FROM registros GROUP BY ALL
        """
        for campo in CAMPOS_COM_ROTULO_CANONICO
    ]
    partes.append(
        """
        SELECT 'grau_de_risco' AS campo, grau_de_risco AS valor, count(*) AS registros,
               string_agg(DISTINCT grau_de_risco_original, ' | ' ORDER BY grau_de_risco_original) AS variantes_na_fonte
        FROM registros GROUP BY ALL
        """
    )
    return " UNION ALL ".join(partes) + " ORDER BY campo, registros DESC"


def main() -> None:
    DERIVADOS.mkdir(parents=True, exist_ok=True)
    conexao = duckdb.connect()
    conexao.execute(f"CREATE TABLE brutos AS {consulta_padrao()} UNION ALL BY NAME {consulta_2022()}")
    conexao.execute(CONSULTA_TIPADA)
    for campo in CAMPOS_COM_ROTULO_CANONICO:
        acrescentar_rotulo_canonico(conexao, campo)
    conexao.execute(
        f"COPY (SELECT * FROM registros ORDER BY data, ano_arquivo) TO {sql_texto(SAIDA_REGISTROS)} (FORMAT parquet, COMPRESSION zstd)"
    )
    conexao.execute(f"COPY ({consulta_valores_distintos()}) TO {sql_texto(SAIDA_VALORES)} (HEADER, DELIMITER ',')")
    resumo = conexao.execute(
        """
        SELECT ano_arquivo, count(*), count(data), count(logradouro_texto), count(bairro)
        FROM registros GROUP BY 1 ORDER BY 1
        """
    ).fetchall()
    for ano, registros, com_data, com_logradouro, com_bairro in resumo:
        print(f"{ano}: {registros} registros, {com_data} com data, {com_logradouro} com logradouro, {com_bairro} com bairro")
    print(f"gravado: {SAIDA_REGISTROS}")
    print(f"gravado: {SAIDA_VALORES}")


if __name__ == "__main__":
    main()
