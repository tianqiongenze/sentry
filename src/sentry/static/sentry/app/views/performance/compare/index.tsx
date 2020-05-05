import React from 'react';
import {Params} from 'react-router/lib/Router';
import {Location} from 'history';

import withOrganization from 'app/utils/withOrganization';
import {Organization} from 'app/types';

import FetchEvent from './fetchEvent';

type Props = {
  location: Location;
  params: Partial<Params>;
  organization: Organization;
};

class TransactionComparison extends React.PureComponent<Props> {
  getEventSlugs() {
    let {baselineEventSlug, regressionEventSlug} = this.props.params;

    baselineEventSlug =
      typeof baselineEventSlug === 'string' ? baselineEventSlug.trim() : undefined;
    regressionEventSlug =
      typeof regressionEventSlug === 'string' ? regressionEventSlug.trim() : undefined;

    return {
      baselineEventSlug,
      regressionEventSlug,
    };
  }

  fetchEvent(eventSlug: string | undefined) {
    if (!eventSlug) {
      return null;
    }

    const {organization} = this.props;

    return <FetchEvent orgSlug={organization.slug} eventSlug={eventSlug} />;
  }

  render() {
    console.log('props', this.props);

    const {baselineEventSlug} = this.getEventSlugs();

    return (
      <div>
        <div>compare transactions</div>
        {this.fetchEvent(baselineEventSlug)}
      </div>
    );
  }
}

export default withOrganization(TransactionComparison);