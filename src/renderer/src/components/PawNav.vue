<template>
  <nav class="fixed w-[160px] h-[160px] right-2 bottom-2 text-white">
    <div class="absolute rounded-full w-20 h-20 right-4 bottom-[22px] bg-primary-500">
      <slot name="main" class="w-full h-full" />
    </div>
    <div class="absolute rounded-full w-12 h-12 left-[17px] bottom-[10px]">
      <slot name="1" />
    </div>
    <div class="absolute rounded-full w-12 h-12 left-2 bottom-[59px]">
      <slot name="2" />
    </div>
    <div class="absolute rounded-full w-12 h-12 left-[45px] top-[10px]">
      <slot name="3" />
    </div>
    <div class="absolute rounded-full w-12 h-12 right-3 top-2">
      <slot name="4" />
    </div>
    <svg
      class="w-full h-full"
      width="502"
      height="494"
      viewBox="0 0 502 494"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_b)">
        <circle cx="328" cy="304" r="174" fill="#2E525F" />
        <circle cx="120.5" cy="405.5" r="90" fill="#2E525F" />
        <circle cx="120.5" cy="337.5" r="76.5" fill="#2E525F" />
        <circle cx="88.5" cy="234.5" r="90" fill="#2E525F" />
        <circle cx="175.52" cy="180.5" r="76.5" fill="#2E525F" />
        <circle cx="210.5" cy="92.5" r="90" fill="#2E525F" />
        <circle cx="304.52" cy="119.5" r="76.5" fill="#2E525F" />
        <circle cx="398.5" cy="88.5" r="90" fill="#2E525F" />
      </g>
      <defs>
        <filter
          id="filter0_b"
          x="-49"
          y="-49"
          width="600"
          height="592"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="24.5" result="blur" />
          <feColorMatrix
            id="colorMatrixElement"
            in="blur"
            mode="matrix"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 25 -15"
            result="matrix"
          />
        </filter>
      </defs>
    </svg>
  </nav>
</template>
