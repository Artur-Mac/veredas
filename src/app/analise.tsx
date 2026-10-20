import { Redirect, useLocalSearchParams } from "expo-router";

export default function AnaliseRedirect() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: "/editar", params }} />;
}
