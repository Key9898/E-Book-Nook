export default function RingAnimation() {
  return (
    <style>
      {`
      @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* emblem icon ring အတွက် cyan→sky animated ring */
      .animated-cyan-ring {
        display: inline-flex;
        border-radius: 0.75rem;           /* rounded-xl */
        border: 2px solid transparent;

        /* inner fill + animated cyan ring */
        background-image:
          linear-gradient(#ffffff, #ffffff),
          linear-gradient(
            90deg,
            #007595,  /* cyan-700 */
            #C9CDCF,  
            #0092b8,  /* cyan-600 */
            #00b8db,  /* cyan-500 */
            #007595,  /* cyan-600 */ 
            #C9CDCF,   
            #0092b8   /* cyan-700 */
          );
        background-origin: border-box;
        background-clip: padding-box, border-box;
        background-size: 100% 100%, 200% 200%;
        background-position: 0% 0, 0% 50%;
        animation: gradientShift 8s linear infinite;
        will-change: background-position;
        overflow: hidden;                 /* rounded clip */
      }
      `}
    </style>
  )
}