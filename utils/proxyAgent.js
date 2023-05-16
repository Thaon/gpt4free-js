import axios from "axios";
import HttpsProxyAgent from "https-proxy-agent";
import tlsClient from "tls-client";

export function CreateAxiosProxy(config, proxy) {
  const createConfig = { ...config };
  const useProxy = process.env.http_proxy || proxy;
  if (useProxy) {
    createConfig.proxy = false;
    createConfig.httpAgent = HttpsProxyAgent(useProxy);
    createConfig.httpsAgent = HttpsProxyAgent(useProxy);
  }
  return axios.create(createConfig);
}

export function CreateTlsProxy(config, proxy) {
  const client = new tlsClient.Session(config);
  const useProxy = process.env.http_proxy || proxy;
  if (useProxy) {
    client.proxy = useProxy;
  }
  return client;
}
