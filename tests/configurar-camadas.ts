// Jest (setupFiles): as camadas de dados ficam fora do bundle (src/dados/camadas.ts, D036) e o app as espera de forma
// assíncrona. Nos testes elas são lidas na hora, do repositório, pelo `require` do Jest: assim os `jest.doMock` de um
// arquivo JSON (ex.: tests/buscar.test.ts) continuam valendo, e nenhum teste precisa esperar uma carga.
import { join } from "path";

(globalThis as { __veredaLerCamadaEmTeste?: (caminho: string) => unknown }).__veredaLerCamadaEmTeste = (caminho) =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(join(__dirname, "..", "src", "dados", caminho)) as unknown;
