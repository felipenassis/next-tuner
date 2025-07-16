'use client'

import { useRef, useEffect } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"

export default function Arrows() {
  
  // useEffect(() => {
  //   setInterval(() => {
  //     const arrows = document.getElementById('arrows-left')?.children
  //     if (!arrows) {
  //       return null
  //     }

  //     const redArrow = Array.from(arrows).find((arrow) => arrow.classList.contains('text-red-900'))

  //     if (!redArrow) {
  //       arrows.item(0)?.classList.add('text-red-900')
  //       return null
  //     }

  //     const nextArrow = redArrow.nextSibling || arrows.item(0)
  //     redArrow.classList.remove('text-red-900')
  //     nextArrow.classList.add('text-red-900')
  //   }, 200)
  // }, [])

  return (
    <div id="arrows-left" className="flex">
      <ChevronRight size={200} />
      <ChevronRight className="ml-[-150px]" size={200} />
      <ChevronRight className="ml-[-150px]" size={200} />
    </div>
  )
}
