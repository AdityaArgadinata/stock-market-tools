import InsiderGlobal from "../components/InsiderGlobal";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function Insider() {
  return <InsiderGlobal token={BEARER_TOKEN} />;
}