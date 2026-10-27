import { beforeEach, expect, it, jest } from "@jest/globals";
import { PermissionStatus } from "expo";
import { getPermissionsAsync, requestPermissionsAsync } from "expo-notifications/build/NotificationPermissions";
import { getAllScheduledNotificationsAsync } from "expo-notifications/build/getAllScheduledNotificationsAsync";
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { reconciliarLembretes, cancelarAvisosDoCaderno, estadoLembretes, permitirLembretes } from "../src/plataforma/lembretes";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
import { Platform } from "react-native";
import { analiseDeTeste } from "./fixtures/caderno";
import { cadernoVazio } from "../src/dados/caderno";
import type { NotificationRequest } from "expo-notifications/build/Notifications.types";
jest.mock("expo-notifications/build/NotificationPermissions",()=>({getPermissionsAsync:jest.fn(),requestPermissionsAsync:jest.fn()}));
jest.mock("expo-notifications/build/getAllScheduledNotificationsAsync",()=>({getAllScheduledNotificationsAsync:jest.fn()}));
jest.mock("expo-notifications/build/cancelScheduledNotificationAsync",()=>({cancelScheduledNotificationAsync:jest.fn()}));
jest.mock("expo-notifications/build/scheduleNotificationAsync",()=>({scheduleNotificationAsync:jest.fn()}));
jest.mock("expo-notifications/build/setNotificationChannelAsync",()=>({setNotificationChannelAsync:jest.fn()}));
jest.mock("expo-notifications/build/NotificationsHandler",()=>({setNotificationHandler:jest.fn()}));
const em="2099-01-01T17:00:00.000Z";
const registro=(id:string,vereda:boolean,quando=em):NotificationRequest=>({identifier:id,content:{title:null,subtitle:null,body:null,categoryIdentifier:null,sound:null,data:{vereda,em:quando,chave:"a/l"}},trigger:null});
const analise=()=>analiseDeTeste("a",{caderno:{...cadernoVazio(),lembretes:[{id:"l",titulo:"Nome privado do imóvel",em,fuso:"America/Recife",estado:"ativo",notificar:true}]}});
beforeEach(()=>{jest.clearAllMocks();jest.mocked(getPermissionsAsync).mockResolvedValue({granted:true,canAskAgain:true,expires:"never",status:PermissionStatus.GRANTED});jest.mocked(getAllScheduledNotificationsAsync).mockResolvedValue([]);});
it("não pede permissão nem token implicitamente; agenda só conteúdo neutro",async()=>{
 await reconciliarLembretes([analise()]);expect(requestPermissionsAsync).not.toHaveBeenCalled();
 const r=jest.mocked(scheduleNotificationAsync).mock.calls[0]![0];expect(r.identifier).toBe("vereda:a:l");expect(JSON.stringify(r.content)).not.toContain("Nome privado");
});
it("no Android cria canal antes de pedir permissão, somente por ação explícita",async()=>{
 const anterior=Platform.OS;Object.defineProperty(Platform,"OS",{value:"android",configurable:true});
 try{jest.mocked(requestPermissionsAsync).mockResolvedValue({granted:false,canAskAgain:false,expires:"never",status:PermissionStatus.DENIED});
 expect(await permitirLembretes()).toContain("não autorizados");
 expect(jest.mocked(setNotificationChannelAsync).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(requestPermissionsAsync).mock.invocationCallOrder[0]!);
 }finally{Object.defineProperty(Platform,"OS",{value:anterior,configurable:true});}
});
it("edição cancela antes de reagendar e repetição não duplica",async()=>{
 jest.mocked(getAllScheduledNotificationsAsync).mockResolvedValue([registro("vereda:a:l",true,"2098-01-01T17:00:00.000Z")]);
 await reconciliarLembretes([analise()]);expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("vereda:a:l");expect(jest.mocked(cancelScheduledNotificationAsync).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(scheduleNotificationAsync).mock.invocationCallOrder[0]!);
 jest.mocked(getAllScheduledNotificationsAsync).mockResolvedValue([registro("vereda:a:l",true)]);jest.mocked(scheduleNotificationAsync).mockClear();await reconciliarLembretes([analise()]);expect(scheduleNotificationAsync).not.toHaveBeenCalled();
});
it("sem permissão cancela apenas avisos próprios e mantém caderno intacto",async()=>{
 const a=analise();jest.mocked(getPermissionsAsync).mockResolvedValue({granted:false,canAskAgain:false,expires:"never",status:PermissionStatus.DENIED});
 jest.mocked(getAllScheduledNotificationsAsync).mockResolvedValue([registro("vereda:a:l",true),registro("outro",false)]);await reconciliarLembretes([a]);expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);expect(scheduleNotificationAsync).not.toHaveBeenCalled();expect(a.caderno?.lembretes).toHaveLength(1);
});
it("falha de cancelamento explícito é informada, sem declarar limpeza completa",async()=>{
 jest.mocked(getAllScheduledNotificationsAsync).mockResolvedValue([registro("vereda:a:l",true)]);jest.mocked(cancelScheduledNotificationAsync).mockRejectedValueOnce(new Error("Falha do sistema"));
 await expect(cancelarAvisosDoCaderno()).rejects.toThrow("Falha do sistema");
 jest.mocked(getAllScheduledNotificationsAsync).mockRejectedValueOnce(new Error("Indisponível"));await reconciliarLembretes([analise()]);expect(estadoLembretes()).toContain("Não foi possível confirmar");
});
