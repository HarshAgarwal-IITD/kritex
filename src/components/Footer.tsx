const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-sm text-foreground">KRITEX</span>
          <span className="font-display text-[10px] text-muted-foreground">
            Defense & Industrial Supply
          </span>
        </div>
        <p className="font-display text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Kritex. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
