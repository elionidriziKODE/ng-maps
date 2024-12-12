import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { InfoWindowManager } from '../services/managers/info-window.manager';

import { NgMapsMarkerComponent } from './marker';

let infoWindowId = 0;

/**
 * NgMapsInfoWindowComponent renders a info window inside a {@link NgMapsMarkerComponent} or standalone.
 *
 * ### Example
 * ```typescript
 * import { Component } from '@angular/core';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *    map-view {
 *      height: 300px;
 *    }
 * `],
 *  template: `
 *    <map-view [latitude]="lat" [longitude]="lng" [zoom]="zoom">
 *      <map-marker [latitude]="lat" [longitude]="lng" [label]="'M'">
 *        <map-info-window [disableAutoPan]="true">
 *          Hi, this is the content of the <strong>info window</strong>
 *        </map-info-window>
 *      </map-marker>
 *    </map-view>
 *  `
 * })
 * ```
 */
@Component({
    selector: 'map-info-window',
    template: `
    <div class="info-window-content" #content>
      <ng-content></ng-content>
    </div>
  `,
    standalone: false
})
export class NgMapsInfoWindowComponent implements OnDestroy, OnChanges, OnInit {
  // @todo how to add correct typings?
  constructor(
    protected _infoWindowManager: InfoWindowManager<any>,
    public readonly elementRef: ElementRef<HTMLElement>,
  ) {}

  private static _infoWindowOptionsInputs: Array<string> = [
    'disableAutoPan',
    'maxWidth',
  ];
  /**
   * The latitude position of the info window (only usefull if you use it ouside of a {@link
   * NgMapsMarkerComponent}).
   */
  @Input() public latitude?: number;

  /**
   * The longitude position of the info window (only usefull if you use it ouside of a {@link
   * NgMapsMarkerComponent}).
   */
  @Input() public longitude?: number;

  /**
   * Disable auto-pan on open. By default, the info window will pan the map so that it is fully
   * visible when it opens.
   */
  @Input() public disableAutoPan?: boolean;

  /**
   * All InfoWindows are displayed on the map in order of their zIndex, with higher values
   * displaying in front of InfoWindows with lower values. By default, InfoWindows are displayed
   * according to their latitude, with InfoWindows of lower latitudes appearing in front of
   * InfoWindows at higher latitudes. InfoWindows are always displayed in front of markers.
   */
  @Input() public zIndex?: number;

  /**
   * Maximum width of the infowindow, regardless of content's width. This value is only considered
   * if it is set before a call to open. To change the maximum width when changing content, call
   * close, update maxWidth, and then open.
   */
  @Input() public maxWidth?: number;

  /**
   * Holds the marker that is the host of the info window (if available)
   */
  public hostMarker?: NgMapsMarkerComponent;

  /**
   * Holds the native element that is used for the info window content.
   */
  @ViewChild('content', { static: true })
  public content?: ElementRef;

  /**
   * Sets the open state for the InfoWindow. You can also call the open() and close() methods.
   */
  @Input() public isOpen: boolean = false;

  /**
   * Emits an event when the info window is closed.
   */
  @Output()
  public infoWindowClose: EventEmitter<void> = new EventEmitter<void>();
  private _infoWindowAddedToManager: boolean = false;
  private _id: string = (infoWindowId++).toString();

  public ngOnInit() {
    this._infoWindowManager.addInfoWindow(this).then(() => {
      this._infoWindowAddedToManager = true;
      this._updateOpenState();
      this._registerEventListeners();
    });
  }

  /** @internal */
  public ngOnChanges(changes: SimpleChanges) {
    if (!this._infoWindowAddedToManager) {
      return;
    }
    if (
      (changes.latitude || changes.longitude) &&
      typeof this.latitude === 'number' &&
      typeof this.longitude === 'number'
    ) {
      this._infoWindowManager.setPosition(this);
    }
    if (changes.zIndex) {
      this._infoWindowManager.setZIndex(this);
    }
    if (changes.isOpen) {
      this._updateOpenState();
    }
    this._setInfoWindowOptions(changes);
  }

  private _registerEventListeners() {
    this._infoWindowManager
      .createEventObservable('closeclick', this)
      .subscribe(() => {
        this.isOpen = false;
        this.infoWindowClose.emit();
      });
  }

  private _updateOpenState() {
    this.isOpen ? this.open() : this.close();
  }

  private _setInfoWindowOptions(changes: SimpleChanges) {
    const options: SimpleChanges = {};
    const optionKeys = Object.keys(changes).filter((k) =>
      NgMapsInfoWindowComponent._infoWindowOptionsInputs.includes(k),
    );
    optionKeys.forEach((k) => {
      options[k] = changes[k].currentValue;
    });
    this._infoWindowManager.setOptions(this, options);
  }

  /**
   * Opens the info window.
   */
  public open(event?: any): Promise<void> {
    return this._infoWindowManager.open(this, event);
  }

  /**
   * Closes the info window.
   */
  public async close(): Promise<void> {
    await this._infoWindowManager.close(this);
    return this.infoWindowClose.emit();
  }

  /** @internal */
  public id(): string {
    return this._id;
  }

  /** @internal */
  public toString(): string {
    return `NgMapsInfoWindowComponent-${this._id.toString()}`;
  }

  /** @internal */
  public ngOnDestroy() {
    this._infoWindowManager.deleteInfoWindow(this);
  }
}
