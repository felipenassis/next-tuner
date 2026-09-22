import React from "react";
import Link from "next/link";
import { AudioLines, KeyboardMusic, ChevronRight, type LucideIcon } from "lucide-react";

type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const items: LinkItem[] = [
  { title: "Afinação", href: "/treinar/afinacao", icon: AudioLines, description: "Treine afinar de ouvido, sem o afinador" },
  { title: "Progressão", href: "/treinar/progressao", icon: KeyboardMusic, description: "Treine reconhecer progressões de acordes" },
];

export default function TrainingLinks() {
  return (
    <div className="flex flex-row flex-grow justify-center items-center">
      <div className="max-w-lg mx-auto p-6">
        <ul className="flex flex-col gap-4">
          {items.map(({ title, href, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-3 bg-surface rounded-xl p-4"
                aria-label={title}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-base font-medium">{title}</span>
                  <span className="block text-sm">{description}</span>
                </span>
                <ChevronRight aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
