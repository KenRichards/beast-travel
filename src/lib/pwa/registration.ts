export interface ServiceWorkerContainerLike {
  register(
    scriptURL: string,
    options?: RegistrationOptions,
  ): Promise<ServiceWorkerRegistration>;
}

export function registerBeastServiceWorker(
  serviceWorker: ServiceWorkerContainerLike,
) {
  return serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
}
