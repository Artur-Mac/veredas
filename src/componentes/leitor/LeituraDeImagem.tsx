import { Texto } from "../Texto";
export function LeituraDeImagem(_props: { aoRevisar: (texto: string) => void; contexto?: "anuncio" | "documento" }) {
  return <Texto tipo="apoio">A leitura automática de imagem ainda não está disponível neste aplicativo nativo. Você pode transcrever o trecho no campo de texto; nenhuma imagem é enviada a serviço externo.</Texto>;
}
