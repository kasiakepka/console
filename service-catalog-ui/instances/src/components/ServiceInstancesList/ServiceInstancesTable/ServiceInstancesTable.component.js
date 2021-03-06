import React, { Component } from 'react';
import LuigiClient from '@kyma-project/luigi-client';
import {
  Button,
  InstanceStatus,
  Modal,
  Table,
  Tooltip,
} from '@kyma-project/react-components';
import { Icon } from 'fundamental-react';

import {
  LinkButton,
  Link,
  ServiceClassButton,
  ServicePlanButton,
  JSONCode,
  TextOverflowWrapper,
} from './styled';
import {
  getResourceDisplayName,
  backendModuleExists,
} from '../../../commons/helpers';

const deleteButton = <Button compact option="light" glyph="delete" />;

export class ServiceInstancesTable extends Component {
  displayBindingsUsages = (bindings = []) => {
    if (!bindings) return null;

    switch (bindings.length) {
      case 0:
        return '-';
      case 1:
        return `${bindings[0].usedBy.name} (${this.capitalize(
          bindings[0].usedBy.kind,
        )})`;
      default:
        return `Multiple (${bindings.length})`;
    }
  };

  capitalize = str => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  goToServiceCatalog = () => {
    LuigiClient.linkManager()
      .fromContext('namespaces')
      .withParams({ selectedTab: this.props.type })
      .navigate('cmf-service-catalog');
  };

  goToServiceClassDetails = serviceClass => {
    if (
      serviceClass.labels &&
      serviceClass.labels['documentation-per-plan'] === 'true'
    ) {
      LuigiClient.linkManager()
        .fromContext('namespaces')
        .navigate(`cmf-service-catalog/details/${serviceClass.name}/plans`);
    } else {
      LuigiClient.linkManager()
        .fromContext('namespaces')
        .navigate(`cmf-service-catalog/details/${serviceClass.name}`);
    }
  };

  goToServiceClassDetailsWithPlan = (serviceClass, plan) => {
    LuigiClient.linkManager()
      .fromContext('namespaces')
      .navigate(`cmf-service-catalog/details/${serviceClass}/plan/${plan}`);
  };

  goToServiceInstanceDetails = name => {
    LuigiClient.linkManager()
      .fromContext('namespaces')
      .navigate(`cmf-instances/details/${name}`);
  };

  render() {
    const { data, deleteServiceInstance, loading } = this.props;

    const serviceCatalogAddonsBackendModuleExists = backendModuleExists(
      'servicecatalogaddons',
    );

    const createTableData = () => {
      return data.map(instance => {
        return {
          rowData: [
            <TextOverflowWrapper>
              <LinkButton data-e2e-id="instance-name">
                <Link
                  onClick={() => this.goToServiceInstanceDetails(instance.name)}
                  data-e2e-id={`instance-name-${instance.name}`}
                  title={instance.name}
                >
                  {instance.name}
                </Link>
              </LinkButton>
            </TextOverflowWrapper>,
            (_ => {
              const instanceClass =
                instance.clusterServiceClass || instance.serviceClass;
              if (!instanceClass || !instanceClass.name) {
                return '-';
              }

              const classTitle = getResourceDisplayName(instanceClass);
              return (
                <TextOverflowWrapper>
                  <ServiceClassButton
                    onClick={() => this.goToServiceClassDetails(instanceClass)}
                    title={classTitle}
                  >
                    {classTitle}
                  </ServiceClassButton>
                </TextOverflowWrapper>
              );
            })(),
            (_ => {
              const plan = instance.clusterServicePlan || instance.servicePlan;
              if (!plan) {
                return '-';
              }
              const instanceClass =
                instance.clusterServiceClass || instance.serviceClass;
              const serviceClassDocsPerPlan =
                instance.serviceClass &&
                instance.serviceClass.labels &&
                instance.serviceClass.labels['documentation-per-plan'] ===
                  'true';
              const planDisplayName = getResourceDisplayName(plan);

              if (
                instance.planSpec &&
                instance.planSpec !== null &&
                typeof instance.planSpec === 'object' &&
                Object.keys(instance.planSpec).length
              ) {
                return (
                  <TextOverflowWrapper>
                    <Modal
                      title="Instance's Parameters"
                      modalOpeningComponent={
                        <ServicePlanButton data-e2e-id="service-plan">
                          {planDisplayName}{' '}
                          <Icon glyph="detail-view" size="s" />
                        </ServicePlanButton>
                      }
                      onShow={() => LuigiClient.uxManager().addBackdrop()}
                      onHide={() => LuigiClient.uxManager().removeBackdrop()}
                    >
                      <JSONCode data-e2e-id="service-plan-content">
                        {JSON.stringify(instance.planSpec, null, 2)}
                      </JSONCode>
                    </Modal>
                  </TextOverflowWrapper>
                );
              }
              return (
                <TextOverflowWrapper>
                  {serviceClassDocsPerPlan ? (
                    <ServicePlanButton
                      data-e2e-id="service-plan"
                      onClick={() =>
                        this.goToServiceClassDetailsWithPlan(
                          instanceClass.name,
                          plan.name,
                        )
                      }
                    >
                      {planDisplayName}
                    </ServicePlanButton>
                  ) : (
                    <span data-e2e-id="service-plan">{planDisplayName}</span>
                  )}
                </TextOverflowWrapper>
              );
            })(),
            (_ => {
              const bindingUsages = this.displayBindingsUsages(
                instance.serviceBindingUsages,
              );

              return (
                <TextOverflowWrapper>
                  <span>{bindingUsages}</span>
                </TextOverflowWrapper>
              );
            })(),
            (_ => {
              if (!instance.status) {
                return '-';
              }

              let type = '';
              switch (instance.status.type) {
                case 'RUNNING':
                  type = 'success';
                  break;
                case 'FAILED':
                  type = 'error';
                  break;
                default:
                  type = 'warning';
              }
              return (
                <Tooltip
                  wrapperStyles="max-width: 100%;"
                  type={type}
                  content={instance.status.message}
                  minWidth="250px"
                >
                  <InstanceStatus status={instance.status.type} />
                </Tooltip>
              );
            })(),
            <Modal
              title="Warning"
              content={`Are you sure you want to delete instance "${instance.name}"?`}
              confirmText="Delete"
              onConfirm={() => deleteServiceInstance(instance.name)}
              modalOpeningComponent={deleteButton}
              type="negative"
              onShow={() => LuigiClient.uxManager().addBackdrop()}
              onHide={() => LuigiClient.uxManager().removeBackdrop()}
            >
              {`Are you sure you want to delete instance "${instance.name}"?`}
            </Modal>,
          ],
        };
      });
    };

    const addServiceInstanceRedirectButton = (
      <Button
        compact
        option="light"
        onClick={this.goToServiceCatalog}
        data-e2e-id="add-instance"
        glyph="add"
      >
        Add Instance
      </Button>
    );

    const title = 'Manage Service Instances';
    const tableData = createTableData();

    let headers = [
      'Name',
      'Service Class',
      'Plan',
      'Bound Applications',
      'Status',
      '',
    ];

    if (!serviceCatalogAddonsBackendModuleExists) {
      headers.splice(3, 1);
      tableData.map(row => {
        row.rowData.splice(3, 1);
        return row;
      });
    }

    return (
      <Table
        title={title}
        addHeaderContent={addServiceInstanceRedirectButton}
        headers={headers}
        tableData={tableData}
        loadingData={loading}
        notFoundMessage="No Service Instances found"
      />
    );
  }
}

export default ServiceInstancesTable;
