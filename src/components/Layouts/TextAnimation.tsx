export const textZoomGradientClass =
  'text-zoom-gradient bg-[linear-gradient(to_right,theme(colors.cyan.700),theme(colors.cyan.600),theme(colors.cyan.700),theme(colors.cyan.400),theme(colors.cyan.700),theme(colors.cyan.600),theme(colors.cyan.700))] bg-clip-text text-transparent'

export function TextAnimation() {
  return (
    <style>
      {`
      :root {
        --animate-zoom: zoom 2s ease-in-out infinite;
        --animate-gradient: gradientShift 8s linear infinite;
      }

      @keyframes zoom {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }

      @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* Tailwind utilities handle the colors; this class only animates */
      .text-zoom-gradient {
        animation: var(--animate-zoom), var(--animate-gradient);
        background-size: 200% 200%;
        display: inline-block;
      }
      `}
    </style>
  )
}