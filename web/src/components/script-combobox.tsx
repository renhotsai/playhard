"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Script } from "@/data/scripts"

interface ScriptComboboxProps {
  scripts: Script[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ScriptCombobox({
  scripts,
  value,
  onValueChange,
  placeholder = "選擇劇本...",
  className,
  disabled = false
}: ScriptComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedScript = scripts.find((script) => script.id.toString() === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedScript ? (
            <span className="truncate">
              {selectedScript.title} ({selectedScript.players}, {selectedScript.duration})
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="搜尋劇本..." className="h-9" />
          <CommandList>
            <CommandEmpty>找不到符合的劇本</CommandEmpty>
            <CommandGroup>
              {scripts.map((script) => (
                <CommandItem
                  key={script.id}
                  value={`${script.title} ${script.title.replace(/謎/g, '迷')} ${script.category} ${script.players} ${script.duration} ${script.difficulty}`}
                  onSelect={() => {
                    onValueChange(script.id.toString())
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{script.title}</span>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === script.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      <span className="bg-secondary px-2 py-0.5 rounded">{script.category}</span>
                      <span>{script.players}</span>
                      <span>{script.duration}</span>
                      {script.difficulty && <span>{script.difficulty}</span>}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}