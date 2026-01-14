const getSafeDomainServer = () => {
  const envDomain = process.env.REACT_APP_DOMAIN_SERVER;
  if (envDomain) {
    try {
      const url = new URL(envDomain);
      const port = parseInt(url.port);
      const unsafePorts = [6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009];
      if (unsafePorts.includes(port)) {
        console.warn(`Port ${port} is blocked by browsers. Using default port 5000 instead.`);
        return "http://localhost:5000";
      }
    } catch (e) {
      console.warn("Invalid REACT_APP_DOMAIN_SERVER format, using default");
    }
  }
  return envDomain || "http://localhost:5000";
};

export const DOMAIN = process.env.REACT_APP_DOMAIN || "http://localhost:3000";
export const DOMAIN_SERVER = getSafeDomainServer();