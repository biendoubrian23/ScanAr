declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      alt?: string;
      poster?: string;
      loading?: 'auto' | 'lazy' | 'eager';
      reveal?: 'auto' | 'manual';

      'ios-src'?: string;
      ar?: boolean | string;
      'ar-modes'?: string;
      'ar-scale'?: 'auto' | 'fixed';
      'ar-placement'?: 'floor' | 'wall';

      'camera-controls'?: boolean | string;
      'touch-action'?: string;
      'camera-orbit'?: string;
      'camera-target'?: string;
      'field-of-view'?: string;
      'min-camera-orbit'?: string;
      'max-camera-orbit'?: string;
      'min-field-of-view'?: string;
      'max-field-of-view'?: string;
      'interaction-prompt'?: 'auto' | 'none';
      'interaction-prompt-threshold'?: string;

      'auto-rotate'?: boolean | string;
      'auto-rotate-delay'?: string;
      'rotation-per-second'?: string;
      'animation-name'?: string;
      autoplay?: boolean | string;

      'shadow-intensity'?: string;
      'shadow-softness'?: string;
      'environment-image'?: string;
      'skybox-image'?: string;
      exposure?: string;
      'tone-mapping'?: string;

      bounds?: string;
      scale?: string;
      orientation?: string;
    };
  }
}
