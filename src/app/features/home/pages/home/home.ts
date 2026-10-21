import { Component } from '@angular/core';
import { HomeBrands } from '../../components/home-brands/home-brands';
import { HomeCategories } from '../../components/home-categories/home-categories';
import { HomeDeal } from '../../components/home-deal/home-deal';
import { HomeFeatured } from '../../components/home-featured/home-featured';
import { HomeHero } from '../../components/home-hero/home-hero';
import { HomeValueStrip } from '../../components/home-value-strip/home-value-strip';

@Component({
  selector: 'app-home',
  imports: [HomeValueStrip, HomeHero, HomeCategories, HomeDeal, HomeFeatured, HomeBrands],
  templateUrl: './home.html',
})
export class Home {}
