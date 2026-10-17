import { SlideChrome } from '../scenes/SlideChrome'
import { FragmentIslands } from '../scenes/FragmentIslands'

export function ProblemSlide() {
  return <>
    <SlideChrome chapter="02" label="РАЗРЫВ В ПРОЦЕССЕ" light />
    <div className="problem-copy"><span className="mono eyebrow reveal">ПРОБЛЕМА / ФРАГМЕНТАЦИЯ</span><h1><span className="type-mask"><span className="type-reveal">Пять систем.</span></span><span className="type-mask"><span className="type-reveal">Один сотрудник.</span></span><span className="type-mask"><span className="type-reveal warm">Ни одного</span></span><span className="type-mask"><span className="type-reveal warm">единого пути.</span></span></h1><div className="problem-rule reveal" /><p className="problem-footnote reveal">Сотрудник сам становится<br />связью между системами.</p></div>
    <FragmentIslands />
    <div className="problem-index reveal"><span>05</span><span className="mono">ТОЧЕК ВХОДА<br />ОДИН ЧЕЛОВЕК</span></div>
  </>
}
