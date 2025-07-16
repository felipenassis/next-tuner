import { ChevronsRight, ChevronsLeft } from "lucide-react"
import Arrows from "@/app/components/Arrows";

export default function Cromatico() {
  return (
    <div className="flex flex-row flex-grow justify-center items-center">
      <Arrows />
      <span className="text-[40vh]">D</span>
      <ChevronsLeft size={200} />
    </div>
  );
}
