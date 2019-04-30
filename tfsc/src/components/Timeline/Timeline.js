import React, {useState} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import HorizontalTimeline from 'react-horizontal-timeline';

import './timeline.scss';


// class Timeline extends Component {
//
//   state = { value: 0, previous: 0 };
//
//   const VALUES = [ '2017-01-2', '2017-01-12', '2017-01-20'];
//
//   render() {
//     return (
//       <div>
//         {/* Bounding box for the Timeline */}
//         <div style={{ width: '60%', height: '100px', margin: '0 auto' }}>
//           <HorizontalTimeline
//             index={this.state.value}
//             indexClick={(index) => {
//               this.setState({ value: index, previous: this.state.value });
//             }}
//             values={ VALUES } />
//         </div>
//         <div className='text-center'>
//           {/* any arbitrary component can go here */}
//           {this.state.value}
//         </div>
//       </div>
//     )
//   }
// }

const TimelineItem = ({id, date, isSelected, timelineItemClickHandler}) => {
  console.log()
  return <div
    className={classNames('timeline-item', {'timeline-item__selected': isSelected})}
  >
    <div
      className="timeline-item-node"
      onClick={() => {
        timelineItemClickHandler(id);
        console.log(id, isSelected)
      }}
    >
      <i className="timeline-item-dot" />
      <div className="timeline-item-text">
        {date}
      </div>
    </div>
  </div>
};

const Timeline = ({events}) => {
  const [selectedId, setSelected] = useState('');

  return (
    <div className="timeline">
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

      <div className="timeline-future">
        <div className="timeline-item">
          <div className="timeline-item-node">

          </div>
        </div>
      </div>

    </div>
  );
};

Timeline.propTypes = {
  events: PropTypes.array
};

export default Timeline;
