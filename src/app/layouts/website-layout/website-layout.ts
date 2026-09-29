import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../shared/components/footer/footer';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-website-layout',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './website-layout.html',
})
export class WebsiteLayout {}
