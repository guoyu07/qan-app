
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import { Subject } from 'rxjs/Subject';
import * as moment from 'moment';

export class Instance {
  Created: string;
  DSN: string;
  Deleted: string;
  Distro: string;
  Id: number;
  Name: string
  ParentUUID: string;
  Subsystem: string;
  UUID: string;
  Version: string;
  Agent?: Instance | null;
}

export class Navigation {
  dbServer: Instance;
  subPath: string = 'profile';
  from: moment.Moment = moment.utc().subtract(1, 'h');
  to: moment.Moment = moment.utc();
  isExtHidden: boolean = true;
}

@Injectable()
export class NavService {

  private instancesUrl = 'http://192.168.56.11:9001/instances?deleted=no';
  public dbServers: Array<Instance>;
  public dbServerMap: { [key: string]: Instance } = {};

  // Observable string sources
  private dbServerSource = new Subject<Instance>();
  private subPathSource = new Subject<string>();
  private navigationSource = new Subject<Navigation>();

  // Observable string streams
  dbServer$ = this.dbServerSource.asObservable();
  subPath$ = this.subPathSource.asObservable();
  navigation$ = this.navigationSource.asObservable();
  nav: Navigation = new Navigation();

  constructor(private http: Http) { }

  setNavigation(elems: {}) {
    if ('dbServerName' in elems) {
      this.nav.dbServer = this.dbServerMap[elems['dbServerName']];
    }
    if ('subPath' in elems) {
      this.nav.subPath = elems['subPath'];
      this.nav.isExtHidden = (elems['subPath'] != 'profile');
    }

    if ('from' in elems) {
      this.nav.from = elems['from'];
    }

    if ('to' in elems) {
      this.nav.to = elems['to'];
    }
    this.navigationSource.next(this.nav);
  }

  // Service message commands
  setDbServer(dbServerName: string) {
    this.dbServerSource.next(this.dbServerMap[dbServerName]);
  }

  setSubPath(subPath: string) {
    this.subPathSource.next(subPath);
  }

  getDBServers(): Promise<Instance[]> {
    return this.http.get(this.instancesUrl)
      .toPromise()
      .then(response => {
        let agents = response.json().filter(i => i.Subsystem === 'agent') as Instance[];
        this.dbServers = response.json().filter(i => i.Subsystem === 'mysql') as Instance[];
        let firstDB = this.dbServers[0];

        for (let srv of this.dbServers) {
          this.dbServerMap[srv.Name] = srv;
        }
        for (let agent of agents) {
          this.dbServerMap[agent.Name].Agent = agent;
        }

        console.log('this.dbServerMap', this.dbServerMap);

        this.nav.dbServer = this.dbServerMap[firstDB.Name];
        this.navigationSource.next(this.nav);
        return this.dbServers;
      })
      .catch(err => console.log(err));
  }
}