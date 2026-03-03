"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

type StepData = {
  title: string;
  subtitle: string;
  description: string;
  legend: string[];
  data: Array<Record<string, number | string>>;
  keys: string[];
};

type CaptionStepperProps = {
  steps: StepData[];
  bootstrapped?: "success" | "already";
};

const chartStyles = [
  { fill: "#ecfdf5", stroke: "#6ee7b7", label: "#047857" },
  { fill: "#fef2f2", stroke: "#fecaca", label: "#b91c1c" },
];


export function CaptionStepper({ steps, bootstrapped }: CaptionStepperProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [chartData, setChartData] = React.useState(steps[0].data);
  const [isSwitching, setIsSwitching] = React.useState(false);

  React.useEffect(() => {
    if (bootstrapped === "success") {
      import("sonner").then(({ toast }) => toast.success("Superadmin access unlocked."));
    }
    if (bootstrapped === "already") {
      import("sonner").then(({ toast }) => toast.message("You are already a superadmin."));
    }
  }, [bootstrapped]);

  const zeroedData = React.useCallback(
    (index: number) => {
      return steps[index].data.map((item) => {
        const next: Record<string, number | string> = { ...item };
        steps[index].keys.forEach((key) => {
          next[key] = 0;
          next[`${key}Count`] = 0;
        });
        return next;
      });
    },
    [steps]
  );

  const swapTo = React.useCallback(
    (index: number) => {
      if (index === activeIndex || isSwitching) return;
      setIsSwitching(true);
      setChartData(zeroedData(activeIndex));
      window.setTimeout(() => {
        setActiveIndex(index);
        setChartData(steps[index].data);
        setIsSwitching(false);
      }, 220);
    },
    [activeIndex, isSwitching, steps, zeroedData]
  );

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY > 0 && activeIndex < steps.length - 1) {
      swapTo(activeIndex + 1);
    } else if (event.deltaY < 0 && activeIndex > 0) {
      swapTo(activeIndex - 1);
    }
  };

  const activeStep = steps[activeIndex];
  const stepSpacing = 64;

  return (
    <div
      className="flex min-h-[70vh] gap-8 overflow-hidden"
      onWheel={handleWheel}
    >
      <div className="relative flex flex-col items-center px-3">
        <div className="h-full w-px bg-border/80" />
        <motion.div
          className="absolute top-0 h-4 w-4 rounded-full bg-primary shadow-lg"
          animate={{ y: activeIndex * stepSpacing }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
        <div className="absolute top-0 flex flex-col gap-12 pt-[2px]">
          {steps.map((step, index) => (
            <button
              key={step.title}
              className={cn(
                "h-4 w-4 rounded-full border border-border/80 bg-background transition",
                index === activeIndex && "scale-110 border-primary bg-primary"
              )}
              onClick={() => swapTo(index)}
              aria-label={`Go to ${step.title}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <h1 className="font-display text-3xl font-semibold text-foreground">
              {activeStep.title}
            </h1>
            <p className="text-sm text-muted-foreground">{activeStep.subtitle}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 rounded-3xl border border-border/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="h-[360px] w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} barGap={12} barCategoryGap={24}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(40,40,40,0.08)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  formatter={(value, name, item) => {
                    const count = Number(
                      (item.payload as Record<string, number | string> | undefined)?.[
                        `${String(item.dataKey)}Count`
                      ] ?? 0
                    );

                    return [`${Number(value).toFixed(1)}% (${count})`, name];
                  }}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "rgba(0,0,0,0.1)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  }}
                />
                {activeStep.keys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={chartStyles[index % chartStyles.length].fill}
                    stroke={chartStyles[index % chartStyles.length].stroke}
                    strokeWidth={1.5}
                    radius={[10, 10, 0, 0]}
                    isAnimationActive
                  >
                    <LabelList
                      dataKey={`${key}Count`}
                      position="center"
                      fill={chartStyles[index % chartStyles.length].label}
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeStep.title}-legend`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="mt-6 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              {activeStep.legend.map((label, index) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: chartStyles[index % chartStyles.length].fill }}
                  />
                  {label}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
          <p className="mt-4 text-sm text-muted-foreground">
            {activeStep.description}
          </p>
        </div>
      </div>
    </div>
  );
}
