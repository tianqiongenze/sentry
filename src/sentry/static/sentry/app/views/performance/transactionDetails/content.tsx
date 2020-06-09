import React from 'react';
import {Params} from 'react-router/lib/Router';
import {Location} from 'history';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import {t} from 'app/locale';
import {trackAnalyticsEvent} from 'app/utils/analytics';
import {Client} from 'app/api';
import withApi from 'app/utils/withApi';
import {Organization, Event} from 'app/types';
import SentryTypes from 'app/sentryTypes';
import EventMetadata from 'app/components/events/eventMetadata';
import {BorderlessEventEntries} from 'app/components/events/eventEntries';
import Button from 'app/components/button';
import LoadingError from 'app/components/loadingError';
import NotFound from 'app/components/errors/notFound';
import AsyncComponent from 'app/components/asyncComponent';
import SentryDocumentTitle from 'app/components/sentryDocumentTitle';
import OpsBreakdown from 'app/components/events/opsBreakdown';
import Projects from 'app/utils/projects';
import {ContentBox, HeaderBox, HeaderBottomControls} from 'app/utils/discover/styles';
import Breadcrumb from 'app/views/performance/breadcrumb';
import {decodeScalar} from 'app/utils/queryString';

//import TagsTable from '../tagsTable';

const slugValidator = function(
  props: {[key: string]: any},
  propName: string,
  componentName: string
) {
  const value = props[propName];
  // Accept slugs that look like:
  // * project-slug:deadbeef
  if (value && typeof value === 'string' && !/^(?:[^:]+):(?:[a-f0-9-]+)$/.test(value)) {
    return new Error(`Invalid value for ${propName} provided to ${componentName}.`);
  }
  return null;
};

type Props = {
  organization: Organization;
  location: Location;
  params: Params;
  api: Client;
  eventSlug: string;
};

type State = {
  event: Event | undefined;
  isSidebarVisible: boolean;
} & AsyncComponent['state'];

class EventDetailsContent extends AsyncComponent<Props, State> {
  static propTypes: any = {
    organization: SentryTypes.Organization.isRequired,
    eventSlug: slugValidator,
    location: PropTypes.object.isRequired,
  };

  state: State = {
    // AsyncComponent state
    loading: true,
    reloading: false,
    error: false,
    errors: [],
    event: undefined,

    // local state
    isSidebarVisible: true,
  };

  toggleSidebar = () => {
    this.setState({isSidebarVisible: !this.state.isSidebarVisible});
  };

  getEndpoints(): Array<[string, string]> {
    const {organization, params} = this.props;
    const {eventSlug} = params;

    const url = `/organizations/${organization.slug}/events/${eventSlug}/`;

    return [['event', url]];
  }

  get projectId() {
    return this.props.eventSlug.split(':')[0];
  }

  renderBody() {
    const {event} = this.state;

    if (!event) {
      return this.renderWrapper(<NotFound />);
    }

    return this.renderWrapper(this.renderContent(event));
  }

  renderContent(event: Event) {
    const {api, organization, location, eventSlug} = this.props;

    // metrics
    trackAnalyticsEvent({
      eventKey: 'performance.event_details',
      eventName: 'Performance: Opened Event Details',
      event_type: event.type,
      organization_id: parseInt(organization.id, 10),
    });

    const {isSidebarVisible} = this.state;
    const transactionName = decodeScalar(location.query.transaction);

    return (
      <React.Fragment>
        <HeaderBox>
          <Breadcrumb
            organization={organization}
            location={location}
            transactionName={transactionName}
            eventSlug={eventSlug}
          />
          <StyledTitle data-test-id="event-header">{event.title}</StyledTitle>
          <HeaderBottomControls>
            <StyledButton size="small" onClick={this.toggleSidebar}>
              {isSidebarVisible ? 'Hide Details' : 'Show Details'}
            </StyledButton>
          </HeaderBottomControls>
        </HeaderBox>
        <ContentBox>
          <div style={{gridColumn: isSidebarVisible ? '1/2' : '1/3'}}>
            <Projects orgId={organization.slug} slugs={[this.projectId]}>
              {({projects}) => (
                <BorderlessEventEntries
                  api={api}
                  organization={organization}
                  event={event}
                  project={projects[0]}
                  location={location}
                  showExampleCommit={false}
                  showTagSummary={false}
                />
              )}
            </Projects>
          </div>
          <div style={{gridColumn: '2/3', display: isSidebarVisible ? '' : 'none'}}>
            <EventMetadata
              event={event}
              organization={organization}
              projectId={this.projectId}
            />
            <OpsBreakdown event={event} />
            {/* TODO show tagstable again.
            <TagsTable eventView={eventView} event={event} organization={organization} />
              */}
          </div>
        </ContentBox>
      </React.Fragment>
    );
  }

  renderError(error) {
    const notFound = Object.values(this.state.errors).find(
      resp => resp && resp.status === 404
    );
    const permissionDenied = Object.values(this.state.errors).find(
      resp => resp && resp.status === 403
    );

    if (notFound) {
      return this.renderWrapper(<NotFound />);
    }
    if (permissionDenied) {
      return this.renderWrapper(
        <LoadingError message={t('You do not have permission to view that event.')} />
      );
    }

    return this.renderWrapper(super.renderError(error, true, true));
  }

  renderLoading() {
    return this.renderWrapper(super.renderLoading());
  }

  renderWrapper(children: React.ReactNode) {
    const {organization} = this.props;

    return (
      <SentryDocumentTitle
        title={t('Performance - Event Details')}
        objSlug={organization.slug}
      >
        <React.Fragment>{children}</React.Fragment>
      </SentryDocumentTitle>
    );
  }
}

const StyledButton = styled(Button)`
  display: none;

  @media (min-width: ${p => p.theme.breakpoints[1]}) {
    display: block;
    width: 110px;
  }
`;

const StyledTitle = styled('span')`
  color: ${p => p.theme.gray700};
  font-size: ${p => p.theme.headerFontSize};
  grid-column: 1 / 2;
`;

export default withApi(EventDetailsContent);