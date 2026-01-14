export function DividerSection({ className }: { className?: string }) {
  return (
    <div className="my-12">
      <div className="my-12 flex flex-col items-center gap-1">
        <div
          className="h-0.5 w-[30%]"
          style={{
            background:
              "radial-gradient(ellipse 40% 40% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 50%)",
          }}
        />
        <div
          className="h-0.75 w-[40%]"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 60%)",
          }}
        />
        <div
          className="h-1 w-[60%]"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 80%)",
          }}
        />

        {/* Main divider */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 80%)",
          }}
        />
        <div
          className="h-1 w-full"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 80%)",
          }}
        />
        {/* Bottom lines - getting shorter and thinner */}
        <div
          className="h-1 w-[75%]"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 80%)",
          }}
        />
        <div
          className="h-0.75 w-[50%]"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 60%)",
          }}
        />
        <div
          className="h-0.5 w-[30%]"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at center, #1b69ff 0%, #1b69ff60 20%, #1b69ff30 40%, #1b69ff10 60%, transparent 50%)",
          }}
        />
      </div>
    </div>
  );
}
