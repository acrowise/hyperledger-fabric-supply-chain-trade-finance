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
  if (!events || events.length === 0) {
    return <></>;
  }
  const [selectedId, setSelected] = useState(events[0].id);

  const isDelivered = events.find(i => i.action === 'Shipment Delivered');

  return (
    <div className="timeline-wrap">
      <div className="timeline">
        <div className="timeline-start">
          <div className="timeline-start-text">{format(shipment.timestamp * 1000, 'DD MMM YYYY')}</div>
          <div className="timeline-item-bottom-text">
            <div>{shipment.shipFrom}</div>
          </div>
        </div>
        <div style={isDelivered ? { backgroundColor: '#69D7BC' } : {}} className="timeline-finish">
          <div className="timeline-finish-text">
            {isDelivered ? format(isDelivered.date, 'DD MMM YYYY') : ''}
          </div>
          <div className="timeline-item-bottom-text">
            <div>{shipment.shipTo}</div>
          </div>
        </div>

        <div
          className="timeline-past"
          style={isDelivered ? { maxWidth: '85%', flexBasis: '85%' } : {}}
        >
          {events
            && events
              .concat([])
              .sort((a, b) => a.date - b.date)
              .filter(i => i.action !== 'Document Uploaded' && i.action !== 'Proof generated')
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
        <div
          style={
            isDelivered ? { backgroundColor: '#69D7BC', maxWidth: '15%', flexBasis: '15%' } : {}
          }
          className="timeline-future"
        />
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
