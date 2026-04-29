//set the url of the server you want to test your code with and start the development server using the following command:
// ng serve --proxy-config ./proxy/proxy.conf.mjs
const environments = {
  example: "https://myPrimoVE.com",
  libis_kul: "https://libis-kul.primo.exlibrisgroup.com/",
  kuleuven_sandbox: "https://libis-kul-psb.primo.exlibrisgroup.com",
};

// export const PROXY_TARGET = environments["example"];
export const PROXY_TARGET = environments["libis_kul"];
