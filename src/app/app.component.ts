import { Component, OnInit } from '@angular/core';
import { LocalVideoTrack, createLocalVideoTrack } from 'twilio-video';
import * as VideoProcessors from '@twilio/video-processors';
import { debounce } from 'rxjs';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'twilio-video-processor-angular';
  videoTrack: LocalVideoTrack = {} as LocalVideoTrack;
  addProcessorOptions = {
    inputFrameBufferType: 'video',
    outputFrameBufferContextType: 'webgl2',
  }
  gaussianBlurProcessor: any;
  virtualBackgroundProcessor: any;
  assetsPath = '/assets/virtual-background';
  ngOnInit(): void {
    this.showLocalVideo()
  }

  showLocalVideo = async () => {
    let videoInput =  (<any>document).getElementById('video');
    let track = await createLocalVideoTrack({
      width: 640,
      height: 480,
      frameRate: 24
    });
    this.videoTrack = track ;
    // console.log('1', this.videoTrack);
    // this.videoTrack.attach(videoInput)
    (<any>document).getElementById('video').appendChild(this.videoTrack.attach());
  }

  async manageBackground(ev?: any) {
    let bg = ev.target?.id
    if (!this.gaussianBlurProcessor) {
      this.gaussianBlurProcessor = new VideoProcessors.GaussianBlurBackgroundProcessor({
        assetsPath: this.assetsPath,
        debounce: true,
      });
      await this.gaussianBlurProcessor.loadModel();
    }
    if (!this.virtualBackgroundProcessor) {
      let backgroundImage: any = await this.loadImage('living_room');
      this.virtualBackgroundProcessor = new VideoProcessors.VirtualBackgroundProcessor({
        assetsPath: this.assetsPath,
        backgroundImage,
      });
      await this.virtualBackgroundProcessor.loadModel();
    }
    if (bg === 'none') {
      this.setProcessor(null, this.videoTrack);
    } else if (bg === 'blur') {
      this.setProcessor(this.gaussianBlurProcessor, this.videoTrack);
    } else {
      this.virtualBackgroundProcessor.backgroundImage = await this.loadImage(bg);
      this.setProcessor(this.virtualBackgroundProcessor, this.videoTrack);
    }
  }

  loadImage = (name: string) =>
  new Promise((resolve) => {
    const image = new Image();
    image.src = `../assets/backgrounds/${name}.jpg`;
    image.onload = () => resolve(image);
  });

  setProcessor = (processor: any, track: any) => {
    if (track.processor) {
      track.removeProcessor(track.processor);
    }
    if (processor) {
      track.addProcessor(processor, this.addProcessorOptions);
    }
  };
}
