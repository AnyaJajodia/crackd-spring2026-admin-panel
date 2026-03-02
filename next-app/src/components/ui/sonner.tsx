import * as React from "react";
import { Toaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof Toaster>;

const Sonner = ({ ...props }: ToasterProps) => {
  return <Toaster richColors closeButton {...props} />;
};

export { Sonner };
