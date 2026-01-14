import BrokerStalker from "../components/BrokerStalker";


export default function Analytics() {
  const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

  return <BrokerStalker token={BEARER_TOKEN}/>;
}