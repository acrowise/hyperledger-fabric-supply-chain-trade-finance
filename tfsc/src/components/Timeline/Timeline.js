import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './timeline.scss';


const TimelineItem = ({
  id, date, isSelected, timelineItemClickHandler
}) => <div
    className={classNames('timeline-item', { 'timeline-item--selected': isSelected })}
  >
    <div
      className="timeline-item-node"
      onClick={() => timelineItemClickHandler(id)}
    >
      <i className="timeline-item-dot" />
      <div className="timeline-item-text">
        {date}
      </div>
    </div>
  </div>;

const TimelineDetails = ({ event, selectedId }) => (
  selectedId && event.id === selectedId && <h2>{event.details.text}</h2> || null
);

const Timeline = ({ events }) => {
  const [selectedId, setSelected] = useState(events[0].id);

  return (
    <div className="timeline-wrap">
      <div className="timeline">
        <div className="timeline-start">
          <div className="timeline-start-text">
            10 april 2019
          </div>
          <div className="timeline-item-bottom-text">
            <div>Amsterdam,</div>
            <div>Netherlands</div>
          </div>
        </div>
        <div className="timeline-finish">
          <div className="timeline-finish-text">
            30 may 2019
          </div>
          <div className="timeline-item-bottom-text">
            <div>Athens,</div>
            <div>Greece</div>
          </div>
        </div>

        <div className="timeline-past">
          {events && events.map(event => (
            <TimelineItem
              id={event.id}
              key={event.id}
              date={event.date}
              timelineItemClickHandler={setSelected}
              isSelected={event.id === selectedId}
            />
          ))}
        </div>
        <div className="timeline-future" />
      </div>
      <div className="timeline-details">
        {events && events.map(event => (
          <TimelineDetails
            key={event.id}
            event={event}
            selectedId={selectedId}
          />
        ))}
      </div>
    </div>
  );
};

Timeline.propTypes = {
  events: PropTypes.array
};

export default Timeline;
