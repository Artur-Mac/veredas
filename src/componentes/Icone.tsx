import Svg, { Path } from "react-native-svg";
import { useTema } from "../tema/Tema";
import { ICONE, type TokenDeCor } from "../tema/tokens";
import { desenhosDeIcones, type NomeIcone } from "./icones";

type Props = { nome: NomeIcone; tamanho?: keyof typeof ICONE; cor?: TokenDeCor; corLivre?: string };

export function Icone({ nome, tamanho = "m", cor = "cor-texto", corLivre }: Props) {
  const { cor: corDe } = useTema();
  const lado = ICONE[tamanho];
  return (
    <Svg width={lado} height={lado} viewBox="0 0 24 24" aria-hidden>
      {desenhosDeIcones[nome].map((d) => (
        <Path
          key={d}
          d={d}
          fill="none"
          stroke={corLivre ?? corDe(cor)}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export function eIcone(nome: string): nome is NomeIcone {
  return nome in desenhosDeIcones;
}
