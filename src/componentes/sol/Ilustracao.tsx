import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import type { LeituraSolar } from "../../dados/sol/geometria";
import { useTema } from "../../tema/Tema";

/** Vista de cima esquemática: não simula dimensões internas ou profundidade de entrada da luz. */
export function IlustracaoSolar({ graus, leitura }: { graus: number; leitura: LeituraSolar }) {
  const { cor } = useTema();
  const a = leitura.sol.azimute * Math.PI / 180;
  const sx = 180 + 130 * Math.sin(a), sy = 116 - 88 * Math.cos(a);
  const dia = leitura.sol.elevacao > 0;
  return <Svg width="100%" height={236} viewBox="0 0 360 236" role="img" accessibilityLabel={`Vista de cima da janela. ${leitura.motivo}.`}>
    <Rect width={360} height={236} rx={18} fill={cor("cor-papel-claro")} />
    <Ellipse cx={180} cy={116} rx={130} ry={88} fill="none" stroke={cor("cor-linha")} strokeDasharray="2 7" />
    <SvgText x={180} y={20} textAnchor="middle" fontFamily="PlusJakartaSans" fontSize={10} fill={cor("cor-texto-apoio")}>NORTE ↑</SvgText>
    {dia ? <Line x1={sx} y1={sy} x2={180} y2={116} stroke={cor(leitura.estado === "sol_potencial" ? "cor-acao" : "cor-traco")} strokeWidth={1.5} strokeDasharray="4 5" /> : null}
    <G transform={`rotate(${graus} 180 116)`}>
      <Rect x={142} y={91} width={76} height={66} rx={4} fill={cor("cor-superficie")} stroke={cor("cor-linha-forte")} strokeWidth={1.5} />
      <Path d="M142 91h16m44 0h16" stroke={cor("cor-texto")} strokeWidth={2} />
      <Path d="M158 91h44M158 95h44" stroke={cor("cor-acao")} strokeWidth={3} />
      <Path d="M176 79l4-6 4 6" fill="none" stroke={cor("cor-barro-texto")} strokeWidth={1.5} strokeLinecap="round" />
    </G>
    <Circle cx={180} cy={123} r={3} fill={cor("cor-texto")} />
    {dia ? <G>
      <Circle cx={sx} cy={sy} r={12} fill={cor("cor-acao")} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(g => <Line key={g} x1={sx + 17 * Math.sin(g * Math.PI / 180)} y1={sy + 17 * Math.cos(g * Math.PI / 180)} x2={sx + 21 * Math.sin(g * Math.PI / 180)} y2={sy + 21 * Math.cos(g * Math.PI / 180)} stroke={cor("cor-barro-texto")} strokeWidth={1.4} strokeLinecap="round" />)}
    </G> : <G>
      <Path d="M294 56a14 14 0 1 1-18-18 13 13 0 0 0 18 18Z" fill={cor("cor-azul-cadastral")} />
      <SvgText x={180} y={197} textAnchor="middle" fontFamily="PlusJakartaSans" fontSize={12} fill={cor("cor-texto-apoio")}>O Sol está abaixo do horizonte</SvgText>
    </G>}
    <SvgText x={180} y={222} textAnchor="middle" fontFamily="PlusJakartaSans" fontSize={10} fill={cor("cor-texto-apoio")}>SUA JANELA · VISTA DE CIMA</SvgText>
  </Svg>;
}

export function DesenhoDaCaptura({ graus }: { graus: number | null }) {
  const { cor } = useTema();
  return <Svg width="100%" height={180} viewBox="0 0 340 180" aria-hidden>
    <Circle cx={170} cy={88} r={70} fill={cor("cor-papel-claro")} stroke={cor("cor-linha")} />
    {[['N', 170, 33], ['L', 228, 92], ['S', 170, 151], ['O', 112, 92]].map(([t, x, y]) => <SvgText key={t} x={x} y={y} textAnchor="middle" fontSize={11} fill={cor("cor-texto-apoio")}>{t}</SvgText>)}
    <G transform={`rotate(${graus ?? 0} 170 88)`}>
      {graus !== null ? <Path d="M170 48l-8 21h16Z" fill={cor("cor-acao")} /> : null}
      <Rect x={158} y={77} width={24} height={39} rx={5} fill={cor("cor-superficie")} stroke={cor("cor-texto")} strokeWidth={1.5} />
      <Line x1={165} y1={82} x2={175} y2={82} stroke={cor("cor-texto-apoio")} strokeWidth={1.5} />
    </G>
  </Svg>;
}
