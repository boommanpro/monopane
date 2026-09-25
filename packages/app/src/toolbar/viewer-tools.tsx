/**
 * 只读预览（viewer）底部工具条
 */

import { useState } from 'react';

import { ZoomSelect } from '../components/tools/zoom-select';
import { ToolContainer, ToolSection } from '../components/tools/styles';
import { MinimapSwitch } from '../components/tools/minimap-switch';
import { Minimap } from '../components/tools/minimap';
import { Interactive } from '../components/tools/interactive';
import { FitView } from '../components/tools/fit-view';

export const ViewerTools = () => {
  const [minimapVisible, setMinimapVisible] = useState(true);

  return (
    <ToolContainer className="canvas-viewer-tools">
      <ToolSection>
        <Interactive />
        <ZoomSelect />
        <FitView />
        <MinimapSwitch minimapVisible={minimapVisible} setMinimapVisible={setMinimapVisible} />
        <Minimap visible={minimapVisible} />
      </ToolSection>
    </ToolContainer>
  );
};
