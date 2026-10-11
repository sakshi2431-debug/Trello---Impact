import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "@atlaskit/button/new";
import { layers } from "@atlaskit/theme/constants";
import { cssMap } from "@atlaskit/css";
import CloseIcon from "@atlaskit/icon/core/close";
import Popup from "@atlaskit/popup";
import type { TriggerProps } from "@atlaskit/popup/types";
import { Box } from "@atlaskit/primitives/compiled/box";
import { Inline } from "@atlaskit/primitives/compiled/inline";
import { Text } from "@atlaskit/primitives/compiled/text";
import { token } from "@atlaskit/tokens";

const styles = cssMap({
  panel: {
    width: "19rem",
    maxWidth: "90vw",
    paddingBlock: token("space.150"),
    paddingInline: token("space.150"),
  },
  header: { position: "relative", paddingBlockEnd: token("space.150") },
  title: {
    flexGrow: 1,
    textAlign: "center",
    paddingInline: token("space.400"),
  },
  close: {
    position: "absolute",
    insetInlineEnd: token("space.0"),
    insetBlockStart: token("space.negative.050"),
  },
  body: { maxHeight: "80vh", overflowY: "auto" },
});

export interface PopoverTriggerArgs {
  triggerProps: TriggerProps;
  isOpen: boolean;
  toggle: () => void;
}

interface Props {
  title: string;
  trigger: (args: PopoverTriggerArgs) => ReactNode;
  children: (close: () => void) => ReactNode;
  placement?: "bottom-start" | "bottom-end" | "right-start";
  onOpenChange?: (isOpen: boolean) => void;
  /** Opens the popover from outside, e.g. when an Impact review returns to editing the date. */
  isOpen?: boolean;
}

/** Re-positions the popover when its content changes size, e.g. when Dates adds Review impact. */
function SizeWatcher({
  onResize,
  children,
}: {
  onResize: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onResizeRef = useRef(onResize);
  useEffect(() => {
    onResizeRef.current = onResize;
  });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => onResizeRef.current());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}

/** Trello-style popover: centred title, close button, scrollable body. Built on ADS Popup. */
export function CardPopover({
  title,
  trigger,
  children,
  placement = "bottom-start",
  onOpenChange,
  isOpen: isOpenProp,
}: Props) {
  const [isOpenState, setOpenState] = useState(false);
  const isOpen = isOpenProp ?? isOpenState;
  const setOpen = (open: boolean) => {
    setOpenState(open);
    onOpenChange?.(open);
  };
  const close = () => setOpen(false);
  return (
    <Popup
      isOpen={isOpen}
      onClose={close}
      placement={placement}
      label={title}
      role="dialog"
      shouldFitViewport
      // These popovers open inside the card modal; match DropdownMenu's default so they stack above it.
      zIndex={layers.modal()}
      content={({ update }) => (
        <SizeWatcher onResize={update}>
          <Box xcss={styles.panel}>
            <Box xcss={styles.header}>
              <Inline alignBlock="center">
                <Box xcss={styles.title}>
                  <Text weight="semibold" color="color.text.subtle">
                    {title}
                  </Text>
                </Box>
              </Inline>
              <Box xcss={styles.close}>
                <IconButton
                  appearance="subtle"
                  spacing="compact"
                  icon={CloseIcon}
                  label="Close popover"
                  onClick={close}
                />
              </Box>
            </Box>
            <Box xcss={styles.body}>{children(close)}</Box>
          </Box>
        </SizeWatcher>
      )}
      trigger={(triggerProps) =>
        trigger({ triggerProps, isOpen, toggle: () => setOpen(!isOpen) })
      }
    />
  );
}
