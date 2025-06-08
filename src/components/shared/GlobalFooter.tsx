export function GlobalFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 bg-background/95 py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {currentYear} Hairflow. All rights reserved.</p>
        <p className="text-sm mt-1">
          Beyond Systems <span className="text-accent">&hearts;</span> Marcos Gimenes.
        </p>
      </div>
    </footer>
  );
}
