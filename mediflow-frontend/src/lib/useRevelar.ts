import { useEffect } from 'react';

/**
 * Hace visibles los elementos con la clase "reveal" cuando entran en pantalla.
 * Sin IntersectionObserver (o con movimiento reducido) los muestra de inmediato.
 */
export function useRevelar() {
  useEffect(() => {
    const elementos = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reducido) {
      elementos.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible');
            observador.unobserve(entrada.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );
    elementos.forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, []);
}
