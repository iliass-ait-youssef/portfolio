import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Proprietes {
  children: ReactNode;
  /** Le nom de la section gardee, pour le message dans la console. */
  nom: string;
  /** Ce qu'il faut faire si la section tombe (par exemple rendre le defilement). */
  surErreur?: () => void;
}

/**
 * UN GARDE-FOU autour de chaque section.
 *
 * Sans lui, une erreur dans un seul composant (un moteur graphique qui
 * echoue, un texte mal forme) fait demonter TOUT l'arbre React : la page
 * devient noire. Avec lui, seule la section fautive disparait ; le reste du
 * site reste lisible et utilisable. L'erreur est ecrite dans la console.
 *
 * React n'offre ce mecanisme qu'aux composants ecrits en classe : c'est le
 * seul du site.
 */
export default class Garde extends Component<Proprietes, { tombee: boolean }> {
  state = { tombee: false };

  static getDerivedStateFromError() {
    return { tombee: true };
  }

  componentDidCatch(erreur: Error, info: ErrorInfo) {
    console.error(`La section « ${this.props.nom} » est tombee :`, erreur, info.componentStack);
    this.props.surErreur?.();
  }

  render() {
    return this.state.tombee ? null : this.props.children;
  }
}
