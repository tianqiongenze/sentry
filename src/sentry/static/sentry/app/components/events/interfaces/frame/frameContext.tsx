import React from 'react';
import {css} from '@emotion/core';

import {SentryAppComponent} from 'app/types';
import {t} from 'app/locale';
import {defined} from 'app/utils';
import ClippedBox from 'app/components/clippedBox';
import ContextLine from 'app/components/events/interfaces/contextLine';
import FrameRegisters from 'app/components/events/interfaces/frameRegisters/frameRegisters';
import FrameVariables from 'app/components/events/interfaces/frameVariables';
import ErrorBoundary from 'app/components/errorBoundary';
import {Assembly} from 'app/components/events/interfaces/assembly';
import {parseAssembly} from 'app/components/events/interfaces/utils';
import {OpenInContextLine} from 'app/components/events/interfaces/openInContextLine';

import {Frame} from './types';

type Props = {
  frame: Frame;
  isExpanded?: boolean;
  hasContextSource?: boolean;
  hasContextVars?: boolean;
  hasContextRegisters?: boolean;
  emptySourceNotation?: boolean;
  hasAssembly?: boolean;
  expandable?: boolean;
  registers: {[key: string]: string};
  components: Array<SentryAppComponent>;
};

const FrameContext = ({
  hasContextVars = false,
  hasContextSource = false,
  hasContextRegisters = false,
  isExpanded = false,
  hasAssembly = false,
  expandable = false,
  emptySourceNotation = false,
  registers,
  components,
  frame,
}: Props) => {
  if (!hasContextSource && !hasContextVars && !hasContextRegisters && !hasAssembly) {
    return emptySourceNotation ? (
      <div className="empty-context">
        <span className="icon icon-exclamation" />
        <p>{t('No additional details are available for this frame.')}</p>
      </div>
    ) : null;
  }

  const getContextLines = () => {
    if (isExpanded) {
      return frame.context;
    }
    return frame.context.filter(l => l[0] === frame.lineNo);
  };

  const contextLines = getContextLines();

  const startLineNo = hasContextSource ? frame.context[0][0] : undefined;

  return (
    <ol start={startLineNo} className={`context ${isExpanded ? 'expanded' : ''}`}>
      {defined(frame.errors) && (
        <li className={expandable ? 'expandable error' : 'error'} key="errors">
          {frame.errors.join(', ')}
        </li>
      )}

      {frame.context &&
        contextLines.map((line, index) => {
          const isActive = frame.lineNo === line[0];
          const hasComponents = isActive && components.length > 0;
          return (
            <ContextLine
              key={index}
              line={line}
              isActive={isActive}
              css={
                hasComponents
                  ? css`
                      background: inherit;
                      padding: 0;
                      text-indent: 20px;
                      z-index: 1000;
                    `
                  : css`
                      background: inherit;
                      padding: 0 20px;
                    `
              }
            >
              {hasComponents && (
                <ErrorBoundary mini>
                  <OpenInContextLine
                    key={index}
                    lineNo={line[0]}
                    filename={frame.filename}
                    components={components}
                  />
                </ErrorBoundary>
              )}
            </ContextLine>
          );
        })}

      {(hasContextRegisters || hasContextVars) && (
        <ClippedBox clipHeight={100}>
          {hasContextRegisters && <FrameRegisters data={registers} key="registers" />}
          {hasContextVars && <FrameVariables data={frame.vars} key="vars" />}
        </ClippedBox>
      )}

      {hasAssembly && (
        <Assembly {...parseAssembly(frame.package)} filePath={frame.absPath} />
      )}
    </ol>
  );
};

export default FrameContext;
