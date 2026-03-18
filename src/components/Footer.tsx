const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container flex flex-col items-center justify-center gap-6">
        <img src="/yellow_full.png" alt="Kritex Logo" className="h-[80px] md:h-[100px] object-contain drop-shadow-sm" />
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-display text-sm tracking-wide text-muted-foreground">
            Defense & Industrial Supply
          </span>
          <p className="font-display text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kritex. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
