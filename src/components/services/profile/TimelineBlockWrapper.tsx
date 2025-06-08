"use client";

import React from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import TimelineBlock from "./TimelineBlock";

interface TimelineItem {
  date: string;
  text: string;
  color?: string;
}

interface TimelineBlockWrapperProps {
  title: string;
  icon: IconDefinition;
  items: TimelineItem[];
  showAll: boolean;
  toggleShow: () => void;
  total: number;
}

const TimelineBlockWrapper: React.FC<TimelineBlockWrapperProps> = ({
  title,
  icon,
  items,
  showAll,
  toggleShow,
  total,
}) => {
  const slicedItems = showAll ? items : items.slice(0, 5);

  return (
    <TimelineBlock
      title={title}
      icon={icon}
      items={slicedItems}
      showAll={showAll}
      toggleShow={toggleShow}
      total={total}
    />
  );
};

export default TimelineBlockWrapper;
