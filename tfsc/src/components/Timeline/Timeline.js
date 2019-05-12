import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { format } from 'date-fns';

import './timeline.scss';

import Table from '../Table/Table';

import { TABLE_MAP } from '../../constants';

const TimelineItem = ({
  id, date, isSelected, timelineItemClickHandler
}) => (
  <div className={classNames('timeline-item', { 'timeline-item--selected': isSelected })}>
    <div className="timeline-item-node" onClick={() => timelineItemClickHandler(id)}>
      <i className="timeline-item-dot" />
      <div className="timeline-item-text">{date}</div>
    </div>
  </div>
);

const TimelineDetails = ({ event }) => <Table fields={TABLE_MAP.SHIPMENT_DETAIL} data={[event]} />;

const Timeline = ({ shipment, events }) => {
  const [selectedId, setSelected] = useState(events[0].id);

  const isDelivered = events.find(i => i.action === 'Shipment Delivered');

  console.log('isDelivered', isDelivered);

  return (
    <div className="timeline-wrap">
      <div className="timeline">
        <div className="timeline-start">
          <div className="timeline-start-text">{format(shipment.timestamp, 'DD MMM YYYY')}</div>
          <div className="timeline-item-bottom-text">
            <div>{shipment.shipmentFrom}</div>
          </div>
        </div>
        <div className="timeline-finish">
          <div className="timeline-finish-text" />
          <div className="timeline-item-bottom-text">
            <div>{shipment.shipmentTo}</div>
          </div>
        </div>

        <div className="timeline-past">
          {events
            && events
              .sort((a, b) => a.timestamp - b.timestamp)
              .filter(i => i.type !== 'document' && i.action !== 'Proof generated')
              .map(event => (
                <TimelineItem
                  id={event.id}
                  key={event.id}
                  date={format(event.date, 'DD MMM YYYY')}
                  timelineItemClickHandler={setSelected}
                  isSelected={event.id === selectedId}
                />
              ))}
        </div>
        <div className="timeline-future" />
      </div>
      <div className="timeline-details">
        {events && (
          <TimelineDetails event={events.find(i => i.id === selectedId)} selectedId={selectedId} />
        )}
      </div>
    </div>
  );
};

Timeline.propTypes = {
  events: PropTypes.array
};

export default Timeline;
