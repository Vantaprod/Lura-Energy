import Image from 'next/image';

type Props = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
};

export function OptimizedImage({
  src,
  alt = '',
  width,
  height,
  fill,
  sizes = '(max-width: 768px) 100vw, (max-width: 1400px) 60vw, 900px',
  priority,
  unoptimized,
  quality = 78,
  className,
  style,
  loading,
}: Props) {
  const isDataUrl = typeof src === 'string' && src.startsWith('data:');
  const isLocalUpload =
    typeof src === 'string' && (src.startsWith('/uploads/') || src.startsWith('/hero/'));

  // base64 avatars — render raw, no benefit from the optimizer
  if (isDataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading ?? 'lazy'}
        draggable={false}
      />
    );
  }

  // external URLs (Cloudinary) go through the optimizer if remotePatterns covers them
  const shouldOptimize = unoptimized ?? !isLocalUpload;
  const shouldPrioritize = priority ?? loading === 'eager';

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={shouldPrioritize}
        unoptimized={shouldOptimize}
        className={className}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 800}
      sizes={sizes}
      quality={quality}
      priority={shouldPrioritize}
      unoptimized={shouldOptimize}
      className={className}
      style={style}
    />
  );
}