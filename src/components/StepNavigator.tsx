import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProcedurePlaybackUnit } from "@/lib/procedure-data";

export type StepNavigatorProps = {
  playback: ProcedurePlaybackUnit[];
  currentIndex: number;
  locked: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
};

const StepNavigator = ({
  playback,
  currentIndex,
  locked,
  onNext,
  onPrevious,
  onSelect,
}: StepNavigatorProps) => {
  const current = playback[currentIndex];

  return (
    <>
      {/* Mobile: one step at a time with arrow navigation */}
      <Card className="h-fit lg:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Step guide</CardTitle>
          <CardDescription>
            Step {currentIndex + 1} of {playback.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-primary bg-primary/5 px-4 py-4">
            <p className="text-xs text-muted-foreground">{current.title}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-foreground">
              {current.supportingText ?? current.cue ?? current.title}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-wrap justify-center gap-1">
              {playback.map((_, i) => (
                <span
                  key={i}
                  className={`block h-1.5 rounded-full transition-all ${
                    i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              disabled={locked}
              aria-label="Next step"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop: full list, all steps visible and clickable */}
      <Card className="hidden h-fit lg:block">
        <CardHeader>
          <CardTitle className="text-xl">Structured flow</CardTitle>
          <CardDescription>
            Use the chapter list to keep the explanation flow anchored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {playback.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                index === currentIndex
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              <p className="text-xs text-muted-foreground">{item.title}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {item.supportingText ?? item.cue ?? item.title}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </>
  );
};

export default StepNavigator;
