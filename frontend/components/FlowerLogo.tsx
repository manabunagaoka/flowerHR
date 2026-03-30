export default function FlowerLogo({ size = 40 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width={size} height={size}>
      <defs>
        <path id="petal" d="M 128 54 C 150 64, 158 92, 128 116 C 98 92, 106 64, 128 54 Z"/>
      </defs>
      <g>
        <use href="#petal" transform="rotate(0 128 128)"   fill="#F4B6C2"/>
        <use href="#petal" transform="rotate(60 128 128)"  fill="#F7D6B5"/>
        <use href="#petal" transform="rotate(120 128 128)" fill="#F3EAC2"/>
        <use href="#petal" transform="rotate(180 128 128)" fill="#DDE8C9"/>
        <use href="#petal" transform="rotate(240 128 128)" fill="#C9DAF0"/>
        <use href="#petal" transform="rotate(300 128 128)" fill="#D6CDEA"/>
      </g>
      <path d="M 128 150 C 118 140, 104 132, 104 118 C 104 106, 118 104, 128 114 C 138 104, 152 106, 152 118 C 152 132, 138 140, 128 150 Z" fill="#FFFFFF"/>
    </svg>
  );
}
