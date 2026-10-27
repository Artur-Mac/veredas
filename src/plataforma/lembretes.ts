// Entradas locais do SDK fixado: o index também importa autorregistro de push,
// que não faz parte dos lembretes privados. Não pedir token ou registrar push.
import { getPermissionsAsync, requestPermissionsAsync } from "expo-notifications/build/NotificationPermissions";
import { getAllScheduledNotificationsAsync } from "expo-notifications/build/getAllScheduledNotificationsAsync";
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { Platform } from "react-native";
import type { AnaliseV2 } from "../dados/contratos";
import { lembretesDesejados, mudancasDeAgendamento, type AgendamentoLocal } from "../dados/lembretes";
let fila: Promise<unknown> = Promise.resolve();
let estado = "Confira a permissão de avisos no sistema. As anotações permanecem no aparelho.";
export function estadoLembretes(): string { return estado; }
export async function permitirLembretes(): Promise<string> {
  if (Platform.OS === "android") await setNotificationChannelAsync("vereda-lembretes", { name: "Lembretes do caderno", importance: AndroidImportance.DEFAULT });
  const p = await requestPermissionsAsync();
  return p.granted ? "Permissão concedida. Guarde o lembrete com aviso ativado para agendar." : "Avisos não autorizados. Você pode guardar a anotação sem notificação.";
}
export function reconciliarLembretes(lista: readonly AnaliseV2[]): Promise<void> {
  const tarefa = fila.then(async () => {
    const agendadas = await getAllScheduledNotificationsAsync();
    const atuais: AgendamentoLocal[] = agendadas.filter(n => n.content.data?.vereda === true)
      .map(n => ({ id: n.identifier, em: String(n.content.data?.em), chave: String(n.content.data?.chave) }));
    const permitido = (await getPermissionsAsync()).granted;
    const todos = permitido ? lembretesDesejados(lista, Date.now()).sort((a, b) => a.em.localeCompare(b.em)) : [];
    const desejados = todos.slice(0, 60);
    const mudancas = mudancasDeAgendamento(atuais, desejados);
    for (const n of mudancas.cancelar) await cancelScheduledNotificationAsync(n.id);
    if (permitido && Platform.OS === "android") await setNotificationChannelAsync("vereda-lembretes", { name: "Lembretes do caderno", importance: AndroidImportance.DEFAULT });
    if (permitido && desejados.length) setNotificationHandler({ handleNotification: async n => ({ shouldShowBanner: n.request.content.data?.vereda === true, shouldShowList: n.request.content.data?.vereda === true, shouldPlaySound: false, shouldSetBadge: false }) });
    for (const n of mudancas.agendar) await scheduleNotificationAsync({ identifier: n.id,
      content: { title: "VEREDA · Lembrete", body: "Você tem uma pendência no seu caderno.", data: { vereda: true, em: n.em, chave: n.chave } },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(n.em), channelId: "vereda-lembretes" } });
    estado = permitido ? `${desejados.length} de ${todos.length} avisos locais solicitados ao sistema. Limite de 60 próximos avisos; abra o app para atualizar os demais. Horários dependem das configurações do aparelho.` : "Sem permissão de aviso; anotações preservadas.";
  }).catch(() => { estado = "Não foi possível confirmar o agendamento. As anotações estão preservadas; confira permissões e tente novamente."; });
  fila = tarefa; return tarefa;
}
export function cancelarAvisosDoCaderno(): Promise<void> {
  const tarefa = fila.then(async () => {
    const atuais = await getAllScheduledNotificationsAsync();
    for (const n of atuais.filter(n => n.content.data?.vereda === true)) await cancelScheduledNotificationAsync(n.identifier);
  });
  fila = tarefa.catch(() => undefined); return tarefa;
}
