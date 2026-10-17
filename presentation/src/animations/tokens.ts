export const motion = {
  reveal: 1.05,
  transition: 0.8,
  stagger: 0.1,
  ease: 'power3.inOut',
  entrance: 'power4.out',
} as const

export const SIZE = { width: 1920, height: 1080 } as const
export const chapters = ['Начало маршрута', 'Пять отдельных систем', 'Один прозрачный путь'] as const

// Identical command structure keeps the path continuous while the camera changes.
export const routes = [
  'M -100 840 C 180 840 360 840 610 840 C 960 840 1250 840 1250 630 C 1250 400 1060 300 1260 270 C 1480 240 1660 300 1660 510 C 1660 810 1800 840 2020 840',
  'M -100 840 C 180 840 450 840 760 840 C 970 840 1040 800 1230 800 C 1600 800 1660 850 1660 640 C 1660 440 1540 350 1290 350 C 1100 350 1650 200 2020 200',
  'M -100 840 C 20 840 65 840 130 840 C 220 840 250 650 330 650 C 440 650 460 840 570 840 C 800 840 780 990 1120 990 C 1550 990 1710 990 2020 990',
] as const
