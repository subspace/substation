// Source code for the Substrate Telemetry Server.
// Copyright (C) 2021 Parity Technologies (UK) Ltd.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import * as React from 'react';
import { Types, Maybe } from '../../common';
import { Filter } from '../';
import { State as AppState, Node } from '../../state';
import { Location } from './';
import { viewport } from '../../utils';

const MAP_RATIO = 800 / 350;
const MAP_HEIGHT_ADJUST = 400 / 350;
const HEADER = 148;

import './Map.css';

export namespace Map {
  export interface Props {
    appState: Readonly<AppState>;
  }

  export interface State {
    filter: Maybe<(node: Node) => boolean>;
    width: number;
    height: number;
    top: number;
    left: number;
  }

  type LocationItem = {
    nodeCount: number;
    position: Location.Position;
  };

  export type Locations = Record<string, LocationItem>;
}

export class Map extends React.Component<Map.Props, Map.State> {
  public state: Map.State = {
    filter: null,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  };

  public componentDidMount() {
    this.onResize();

    window.addEventListener('resize', this.onResize);
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  private getNodeLocations(nodes: Node[]): Map.Locations {
    return nodes.reduce((acc, { city, lat, lon }) => {
      // Skip nodes with unknown location
      if (city && lat && lon) {
        if (acc[city]) {
          acc[city].nodeCount += 1;
        } else {
          acc[city] = {
            nodeCount: 1,
            position: this.pixelPosition(lat, lon),
          };
        }
      }
      return acc;
    }, {});
  }

  public render() {
    const { appState } = this.props;
    // const { filter } = this.state;
    const nodes = appState.nodes.getList();
    const locations = this.getNodeLocations(nodes);
    // nodes = nodes.length <= 1300 ? nodes : nodes.slice(0, 1300);

    return (
      <React.Fragment>
        <div className="Map">
          {Object.values(locations).map(({ position, nodeCount }, i) => {
            // const { lat, lon } = node;

            // const focused = filter == null || filter(node);

            // if (lat == null || lon == null) {
            //   // Skip nodes with unknown location
            //   return null;
            // }

            // const position = this.pixelPosition(lat, lon);

            return (
              <Location
                key={i}
                position={position}
                // focused={focused}
                // node={node}
                nodeCount={nodeCount}
              />
            );
          })}
        </div>
        <Filter onChange={this.onFilterChange} />
      </React.Fragment>
    );
  }

  private pixelPosition(
    lat: Types.Latitude,
    lon: Types.Longitude
  ): Location.Position {
    const { state } = this;

    // Longitude ranges -180 (west) to +180 (east)
    // Latitude ranges +90 (north) to -90 (south)
    const left = Math.round(((180 + lon) / 360) * state.width + state.left);
    const top = Math.round(
      ((90 - lat) / 180) * state.height * MAP_HEIGHT_ADJUST + state.top
    );

    let quarter: Location.Quarter = 0;

    if (lon > 0) {
      quarter = (quarter | 1) as Location.Quarter;
    }

    if (lat < 0) {
      quarter = (quarter | 2) as Location.Quarter;
    }

    return { left, top, quarter };
  }

  private onResize: () => void = () => {
    const vp = viewport();

    vp.width = Math.max(1350, vp.width);
    vp.height -= HEADER;

    const ratio = vp.width / vp.height;

    let top = 0;
    let left = 0;
    let width = 0;
    let height = 0;

    if (ratio >= MAP_RATIO) {
      width = Math.round(vp.height * MAP_RATIO);
      height = Math.round(vp.height);
      left = (vp.width - width) / 2;
    } else {
      width = Math.round(vp.width);
      height = Math.round(vp.width / MAP_RATIO);
      top = (vp.height - height) / 2;
    }

    this.setState({ top, left, width, height });
  };

  private onFilterChange = (filter: Maybe<(node: Node) => boolean>) => {
    this.setState({ filter });
  };
}
