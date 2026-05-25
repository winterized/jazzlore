import { ArrowOut } from '../marks/ArrowOut'

export function OpenCta() {
  return (
    <span className="jzl-cta">
      Open
      <ArrowOut size={10} />
      <span className="jzl-cta-underline" aria-hidden="true" />
    </span>
  )
}
