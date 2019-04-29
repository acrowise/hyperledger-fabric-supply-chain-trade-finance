import React, { Component } from 'react';
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



const Timeline = () => {

  return (
    <div className="timeline">
      <div className="timeline-item">
        <div className="timeline-item-node">

        </div>
      </div>
    </div>
  )
};

export default Timeline;